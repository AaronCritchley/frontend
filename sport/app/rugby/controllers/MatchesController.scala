package rugby.controllers

import common._

import common.{ExecutionContexts, JsonComponent}
import model.{Cached, MetaData}
import play.api.mvc.{Action, Controller}
import rugby.jobs.RugbyStatsJob
import rugby.model.{ScoreType, Match}
import rugby.feed.{CapiFeed, OptaFeed}
import rugby.model.Match

case class MatchPage(liveScore: Match) extends MetaData {
  override lazy val id = s"/sport/rugby/api/score/${liveScore.date.toString("yyyy/MMM/dd")}/${liveScore.homeTeam.id}/${liveScore.awayTeam.id}"
  override lazy val section = "rugby"
  override lazy val webTitle = s"${liveScore.homeTeam.name} v ${liveScore.awayTeam.name} "
  override lazy val analyticsName = s"GFE:Rugby:automatic:match:${liveScore.date.toString("dd MMM YYYY")}:${liveScore.homeTeam.name} v ${liveScore.awayTeam.name}"
}

object MatchesController extends Controller with Logging with ExecutionContexts {

  def scoreJson(year: String, month: String, day: String, homeTeamId: String, awayTeamId: String) = score(year, month, day, homeTeamId, awayTeamId)

  def score(year: String, month: String, day: String, team1: String, team2: String) = Action { implicit request =>

    val matchFixture = RugbyStatsJob.getFixturesAndResultScore(year, month, day, team1, team2)
    val matchOpt =  RugbyStatsJob.getLiveScore(year, month, day, team1, team2)
      .map ( m => m.copy( venue = matchFixture.flatMap(_.venue)))
      .orElse(matchFixture)
      .filter(m => m.awayTeam.score.isDefined && m.homeTeam.score.isDefined)
    val currentPage = request.getParameter("page")

    matchOpt.map { aMatch =>
      val matchNav = CapiFeed.findMatchArticle(aMatch).map(rugby.views.html.fragments.matchNav(_, currentPage).toString)

      val scoreEvents = RugbyStatsJob.getScoreEvents(aMatch.id)

      val (homeTeamScorers, awayTeamScorers) =  scoreEvents.partition(_.player.team.id == aMatch.homeTeam.id)

      val page = MatchPage(aMatch)
      Cached(60){
        if (request.isJson)
          JsonComponent(
            "matchSummary" -> rugby.views.html.fragments.matchSummary(page, aMatch, homeTeamScorers, awayTeamScorers).toString,
            "nav" -> matchNav.getOrElse("")
          )
        else
          Ok(rugby.views.html.matchSummary(page, aMatch, homeTeamScorers, awayTeamScorers))
      }

    }.getOrElse(NotFound)
  }
}
